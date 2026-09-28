import { Request, Response } from "express";
import { handleDashboardStats } from "../tool-services/agent.services";



export async function getStatisticData(req: Request, res: Response) {
    try {
        const data = await handleDashboardStats()

        return res.json({ status: true, data })
    } catch (error: any) {
        console.log('Error execution statistics data', error);
        return res.status(500).json({ status: false, message: error?.message });
    }
}  