// types/index.d.ts
export type Product = {
    id: string;
    code: number;
    name: string;
    quantity: number;
    price_v: number;
    expirationDate: string;
    codeBar?: string | null;
};