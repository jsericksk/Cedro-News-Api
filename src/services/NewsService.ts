import * as cheerio from "cheerio";
import axios from "axios";
import { News } from "../models/News";
import { NewsContent } from "../models/NewsContent";

export class NewsService {
    private BASE_URL = "https://cedro.ce.gov.br/informa.php?";

    async getNews(page: number): Promise<News[] | Error> {
        try {
            const selector = await this.getCheerioSelector(`pagina=${page}`);
            const news: News[] = [];
            selector(".col-md-3.noticia1").each((index, element) => {
                const idFound = selector(element).find("a").attr("href")?.replace("informa.php?id=", "");
                const id = idFound ? Number(idFound) : -1;
                const title = selector(element).find(".p_noticia1").text().trim();
                let imageUrl = selector(element).find("img").attr("src") as string;
                imageUrl = this.fixImageUrl(imageUrl);
                const category = selector(element).find("span[style]").text().trim();
                const date = selector(element).find("strong[style]").text().trim();
                const elapsedTime = selector(element).find("p[style]").last().text();

                const newsItem: News = {
                    id: id,
                    title: title,
                    imageUrl: imageUrl,
                    category: category,
                    date: date,
                    elapsedTime: elapsedTime
                };
                news.push(newsItem);
            });
            return news;
        } catch (error) {
            return new Error("Erro ao obter os dados das notícias");
        }
    }

    async getNewsById(newsId: number): Promise<NewsContent | Error> {
        try {
            const selector = await this.getCheerioSelector(`id=${newsId}`);
            const title = selector("strong[data-pesquisa]").text();
            const subtitle = selector(".p-abre").text();
            let imageUrl = selector(".imginfo").attr("src");
            imageUrl = this.fixImageUrl(imageUrl);
            const content = selector(".p-info").text();
            let date = selector("span[style=\"font-size: 12px; color:#303030;\"]").text().trim();
            const match = date.match(/\d+/);
            if (match) {
                /**
                 * Corrige datas que tenham um valor como: "POSTADO POR JOHN 26 DE OUTUBRO DE 2023"
                 * Para: "26 DE OUTUBRO DE 2023"
                 */
                const firstNumberIndex = date.indexOf(match[0]);
                date = date.substring(firstNumberIndex);
            }

            const newsContent: NewsContent = {
                id: newsId,
                title: title,
                subtitle: subtitle,
                imageUrl: imageUrl,
                content: content,
                date: date
            };
            return newsContent;
        } catch (error) {
            return new Error("Erro ao obter os dados da notícia");
        }
    }

    private fixImageUrl(imageUrl: string | undefined): string {
        if (imageUrl !== undefined) {
            if (!imageUrl?.startsWith("https://")) {
                const fixedImageUrl = "https://cedro.ce.gov.br/" + imageUrl;
                return fixedImageUrl;
            }
            return imageUrl;
        }
        return "";
    }

    async getTotalPages(): Promise<number> {
        try {
            const selector = await this.getCheerioSelector("pagina=0");
            let totalPages = -1;
            selector(".pagination").find("li").each((index, element) => {
                const pageUrl = selector(element).find("a[href]").attr("href");
                if (pageUrl) {
                    const pageNumber = parseInt(pageUrl.replace("?pagina=", ""));
                    totalPages = Math.max(totalPages, pageNumber);
                }
            });
            return totalPages;
        } catch (error) {
            console.error("Erro ao obter total de páginas", error);
            return -1;
        }
    }

    private async getCheerioSelector(query: string): Promise<cheerio.Root> {
        const url = `${this.BASE_URL}${query}`;
        const html = await this.getHtml(url);
        return cheerio.load(html);
    }

    private async getHtml(url: string): Promise<string> {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error("Erro ao fazer a solicitação HTTP:", error);
            throw error;
        }
    }
}