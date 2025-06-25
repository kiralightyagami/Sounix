import { Router } from "express";
import { MediaFileController } from "../../controller/mediaFile.controller";

const mediaFileRouter = Router();

const mediaFileController = new MediaFileController();


mediaFileRouter.post("/:mediaFileId/chunks", mediaFileController.uploadMediaFile);
mediaFileRouter.post("/:mediaFileId/transcript", mediaFileController.requestTranscript);
mediaFileRouter.get("/:mediaFileId/transcript", mediaFileController.getTranscript);



export default mediaFileRouter;
