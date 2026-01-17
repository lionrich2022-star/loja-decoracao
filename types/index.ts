export interface Papel {
    id: string;
    nome: string;
    imagem_url: string;
    preco_m2: number;
    loja_id: string;
}

export interface Orcamento {
    id: string;
    cliente_nome?: string;
    largura: number;
    altura: number;
    area: number;
    valor_total: number;
    status: 'novo' | 'whatsapp_enviado' | 'fechado';
    created_at: string;
    papel: Papel;
}
