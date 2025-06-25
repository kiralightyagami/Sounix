import express from "express";
import roomRouter from "./routes/v1/rooms";
import mediaFileRouter from "./routes/v1/mediaFile";
import transcriptionRouter from "./routes/v1/transcription";

const app = express();

app.use(express.json());

app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/media-files", mediaFileRouter);
app.use("/api/v1/transcripts", transcriptionRouter);


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});