import { Storage } from "@google-cloud/storage";
import {
	GOOGLE_CLOUD_KEY_FILE,
	GOOGLE_CLOUD_PROJECT_ID,
	IMAGES_FOLDER,
	STORAGE_BUCKET,
} from "../config/config";
import Container, { Inject, Service } from "typedi";
import { logger } from "../logger/logger";

@Service()
export class CloudStorageDriver {
	private readonly storage: Storage;

	@Inject(STORAGE_BUCKET)
	private readonly bucketName: string;

	private readonly imagesFolder: string = IMAGES_FOLDER;

	constructor() {
		this.storage = new Storage({
			projectId: Container.get(GOOGLE_CLOUD_PROJECT_ID),
			keyFilename: Container.get(GOOGLE_CLOUD_KEY_FILE),
		});
	}

	public async uploadImage(file: Express.Multer.File, id: string) {
        const originalExtension = file.originalname.split(".").pop();
        const fileName = `${id}.${originalExtension}`

		const bucket = this.storage.bucket(this.bucketName);
		const blob = bucket.file(`${this.imagesFolder}/${fileName}`);

		const blobStream = blob.createWriteStream({
			resumable: false,
		});

		blobStream.on("error", (err) => {
			logger.error(err);
            throw err;
		});

		blobStream.on("finish", () => {
			logger.info("image uploaded");
		});

		blobStream.end(file.buffer);

		return `https://storage.googleapis.com/${this.bucketName}/${this.imagesFolder}/${fileName}`;
	}
}
