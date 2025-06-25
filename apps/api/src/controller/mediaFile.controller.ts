import { Request, Response } from "express";
import { prisma } from "db/client";

export class MediaFileController {
    async uploadMediaFile(req: Request, res: Response) {
        const { mediaFileId } = req.params;
        const { file } = req.body;

        const mediaFile = await prisma.mediaFile.create({
            data: {
                id: mediaFileId,
                name: file.name,
            },
        });
        res.status(200).json(mediaFile);
    }

    async getTranscript(req: Request, res: Response) {
        const { mediaFileId } = req.params;
        const transcript = await prisma.transcript.findUnique({
            where: {
                id: mediaFileId,
            },
        }); 
        res.status(200).json(transcript);
    }

    async requestTranscript(req: Request, res: Response) {
        const { mediaFileId } = req.params;
        const transcript = await prisma.transcript.create({
            data: {
                id: mediaFileId,
            },
        });
        res.status(200).json(transcript);
    }

    
}