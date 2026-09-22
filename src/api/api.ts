export async function callAPI(url = '/', method = 'GET', payload = {}){
const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                'HTTP-Referer': 'http://locahost:5173',
                'X-Title': 'dev-flow',
                'Content-Type': 'application/json',

            },
            body: JSON.stringify({
                model: 'openrouter/free',
                messages: [
                    {
                        role: 'user',
                        content: payload,
                    },
                ],
            }),
        })
    }