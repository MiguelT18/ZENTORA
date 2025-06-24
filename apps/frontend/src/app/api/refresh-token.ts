import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendResponse = await axios.post("http://localhost:8000/api/v1/auth/refresh", null, {
      headers: {
        Cookie: req.headers.cookie || "", // forward cookies
      },
      withCredentials: true,
    });

    const newToken = backendResponse.data.access_token;

    res.status(200).json({ token: newToken });
  } catch (error: any) {
    console.error("Refresh token failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Error refreshing token" });
  }
}
