import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as parseHTML } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';

class BookkorPlugin implements Plugin.PluginBase {
  id = 'bookkor';
  name = 'Bookkor (북코)';
  icon = 'src/korean/bookkor/icon.png';
  site = 'https://bookkor.com';
  version = '1.0.0';

  private abs(src?: string) {
    if (!src) return defaultCover;
    return src.startsWith('http') ? src : this.site + src;
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const body = await fetchApi(`${this.site}/?page=${pageNo}`).then(r => r.text());
    const $ = parseHTML(body);
    const novels: Plugin.NovelItem[] = [];

    $('div.novel-card, article, div.list-item').each((_, el) => {
      const a = $(el).find('a').first();
      const path = (a.attr('href') || '').replace(this.site, '');
      const name = $(el).find('h3, .title, .novel-title').text().trim();
      if (name && path) {
        novels.push({ name, path, cover: this.abs($(el).find('img').attr('src')) });
      }
    });
    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const body = await fetchApi(this.site + novelPath).then(r => r.text());
    const $ = parseHTML(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('h1, .novel-title, .title').first().text().trim(),
      cover: this.abs($('.novel-cover img, .cover img, img.cover').attr('src')),
      summary: $('.novel-description, .summary, .description').text().trim(),
      chapters: [],
    };

    $('.chapter-list a, .list-item a, ul.chapters a').each((i, el) => {
      const path = ($(el).attr('href') || '').replace(this.site, '');
      if (path) {
        novel.chapters!.push({
          name: $(el).text().trim(),
          path,
          chapterNumber: i + 1,
        });
      }
    });
    
    novel.chapters!.reverse(); 
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const body = await fetchApi(this.site + chapterPath).then(r => r.text());
    const $ = parseHTML(body);
    
    const el = $('.chapter-content, #novel-content, .viewer-text, div.content');
    el.find('script, style, ins, .banner, .ads').remove();
    return el.html() || '';
  }

  async searchNovels(term: string, pageNo: number): Promise<Plugin.NovelItem[]> {
    const body = await fetchApi(
      `${this.site}/?search=${encodeURIComponent(term)}&page=${pageNo}`,
    ).then(r => r.text());
    const $ = parseHTML(body);
    const novels: Plugin.NovelItem[] = [];

    $('div.novel-card, article, div.list-item').each((_, el) => {
      const path = ($(el).find('a').first().attr('href') || '').replace(this.site, '');
      const name = $(el).find('h3, .title, .novel-title').text().trim();
      if (name && path) {
        novels.push({ name, path, cover: this.abs($(el).find('img').attr('src')) });
      }
    });
    return novels;
  }
}

export default new BookkorPlugin();

