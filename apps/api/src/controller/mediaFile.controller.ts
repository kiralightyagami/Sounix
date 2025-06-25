import { Request, Response } from "express";
import { prisma } from "db/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export class MediaFileController {
    async uploadMediaFile(req: Request, res: Response) {
        const { mediaFileId } = req.params;
        const { chunkNumber, totalChunks, chunk } = req.body;

        const s3 = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });
        const s3Key = `${mediaFileId}/${chunkNumber}`;
        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: s3Key,
            Body: Buffer.from(chunk, 'base64')
        }));

       
        if (chunkNumber === totalChunks) {
            const mediaFile = await prisma.mediaFile.create({
                data: {
                    id: mediaFileId,
                    s3Key: `${mediaFileId}/complete`,
                    status: 'UPLOADED'
                }
            });
            res.status(200).json(mediaFile);
        } else {
            res.status(200).json({
                message: `Chunk ${chunkNumber} of ${totalChunks} uploaded successfully`
            });
        }
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