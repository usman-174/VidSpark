interface Dependencies {
    prisma: any;
    axios: any;
    scrapeYouTubeData: any;
  }
  
  let deps: Dependencies | null = null;
  
  export async function initializeDependencies() {
    if (deps) return deps;
  
    const [
      { PrismaClient },
      axiosModule,
      scraperModule
    ] = await Promise.all([
      import('@prisma/client'),
      import('axios'),
      process.env.NODE_ENV === 'development'
        ? import('../scripts/YTscraper.dev')
        : import('../scripts/YTscraper')
    ]);
  
    deps = {
      prisma: new PrismaClient(),
      axios: axiosModule.default,
      scrapeYouTubeData: scraperModule.scrapeYouTubeData
    };
  
    return deps;
  }