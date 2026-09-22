import { analyzeTicketLLM } from "../services/ai.service";

export async function analyzeTicket(req: any, res: any) {
    try {
        const { ticket } = req?.body;
        if (!ticket) {
            return res.status(422).json({
                status: false,
                message: 'Ticket missing, please provide a ticket',
            })
        }

        const data = await analyzeTicketLLM(ticket);

        return res.status(200).json({
            status: true,
            data,
        })
    } catch (err: any) {
        console.log('Error............', err);
        
        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }
}