import cors from 'cors';

const corsPolicies = cors({
    origin: "http://localhost:5173",
})

export default corsPolicies;