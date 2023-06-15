import Container, { Service } from "typedi";
import { MODEL_NAME, MODEL_PATH } from "../config/config";
import * as tf from "@tensorflow/tfjs-node";

export class Prediction {
	public index: number;
	public probability: number;
}

export class PredictionResponse {
	public predictions: Prediction[];
	public meta: {
		modelName: string;
		latency: number;
		timestamp: number;
	};
}

@Service()
export class PredictorService {
	private readonly modelPath: string;
	private readonly modelName: string;
	private model: tf.LayersModel;

	constructor() {
		this.modelPath = Container.get(MODEL_PATH);
		this.modelName = Container.get(MODEL_NAME);
	}

	public async init() {
		this.model = await tf.loadLayersModel(this.modelPath);
	}

	public async predict(imageBuffer: Buffer): Promise<PredictionResponse> {
		const start = Date.now();

		const image = tf.node.decodeImage(imageBuffer);
		// resize the image to 299x299
		const resizedImage = tf.image.resizeBilinear(image, [299, 299]);
		// Normalize the pixel values
		const normalizedImage = resizedImage.div(255.0);
		// expand the dimensions to make it suitable for the model
		const expandedImage = normalizedImage.expandDims(0);
		// make the prediction
		const prediction = this.model.predict(expandedImage);

		// predition is tf.tensor<tf.Rank> | tf.Tensor<tf.Rank>[], convert it to tf.Tensor<tf.Rank>[]
		const predictionTensor = Array.isArray(prediction)
			? prediction
			: [prediction];

		const top10 = tf.topk(predictionTensor[0], 10);

		const top10Indices = top10.indices.arraySync() as number[][];

		const top10Probabilities = top10.values.arraySync() as number[][];

		const predictions: Prediction[] = [];

		for (let i = 0; i < top10Indices[0].length; i++) {
			const prediction: Prediction = {
				index: top10Indices[0][i],
				probability: top10Probabilities[0][i],
			};
			predictions.push(prediction);
		}

		return {
			predictions,
			meta: {
				modelName: this.modelName,
				latency: Date.now() - start,
				timestamp: Date.now(),
			},
		};
	}
}
