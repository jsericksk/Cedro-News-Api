import { Request, Response } from "express";
import { simpleError } from "../errors/simpleError";
import { NewsService } from "../services/NewsService";

export class NewsController {
    private newsService: NewsService;

    constructor() {
        this.newsService = new NewsService();
    }

    getNews = async (req: Request, res: Response): Promise<Response> => {
        const page = req.query.page;
        const parsedPage = parseInt(page as string);
        if (isNaN(parsedPage)) {
            return res.status(400).json(simpleError("Número de página inválido"));
        }

        const result = await this.newsService.getNews(parsedPage);
        if (result instanceof Error) {
            return res.status(500).json(simpleError(result.message));
        } else if (result.length === 0) {
            return res.status(500).json(simpleError("Não há notícias para a página informada"));
        }

        const totalPages = await this.newsService.getTotalPages();
        const info = {
            pages: totalPages,
            news: result,
        };
        return res.status(200).json(info);
    };

    getNewsById = async (req: Request, res: Response): Promise<Response> => {
        const id = req.params.id;
        const parsedId = parseInt(id as string);
        if (isNaN(parsedId)) {
            return res.status(400).json(simpleError("Id de notícia inválido"));
        }

        const result = await this.newsService.getNewsById(parsedId);
        if (result instanceof Error) {
            return res.status(500).json(simpleError(result.message));
        } else if (result.title.length === 0 && result.content.length === 0) {
            return res.status(404).json(simpleError("Nenhuma notícia encontrada com o id informado"));
        }

        return res.status(200).json(result);
    };
}