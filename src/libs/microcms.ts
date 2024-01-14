import { MicroCMSImage, MicroCMSQueries, createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN as string,
  apiKey: process.env.MICROCMS_API_KEY as string,
});

type Tool = {
  id: string;
  name: string;
  website: string;
  icon: MicroCMSImage;
  description: string;
  category: string[];
  platform: string[];
};

export const fetchTools = async (queries?: MicroCMSQueries) => {
  return await client.getList<Tool>({
    endpoint: "tools",
    queries,
  });
};

export const fetchTool = async (
  contentId: string,
  queries?: MicroCMSQueries,
) => {
  return await client.getListDetail<Tool>({
    endpoint: "tools",
    contentId,
    queries,
  });
};
