import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const service = google.youtube({
  version: "v3",
  auth: process.env.YT_API_KEY,
});

export const search = async (query) => {
  const { data } = await service.search.list({
    q: query,
    part: "id",
    maxResults: 5,
  });
  const res = await service.videos.list({
    id: data.items.map((x) => x.id.videoId),
    part: ["snippet", "contentDetails"],
    fields: "items(id,snippet(title),contentDetails(duration))",
  });
  return res.data.items;
};

export const getTitle = async (id) => {
  const res = await service.videos.list({
    id,
    part: ["snippet"],
    fields: "items(snippet(title))",
  });
  return res.data.items[0].snippet.title;
};
