const Services = () => {
    return (
        <section className="py-20 px-6 text-center bg-white">
          <h2 className="text-4xl font-bold text-gray-800">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 max-w-6xl mx-auto">
            <div className="p-6 shadow-lg rounded-lg bg-gray-100 hover:bg-gray-200 transition-all">
              <h3 className="text-2xl font-semibold">Title Generation</h3>
              <p className="mt-2 text-gray-600">Optimize your titles for SEO and maximize visibility with smart suggestions. Each title is generated using credits, ensuring high-quality and engaging results tailored to your content.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-gray-100 hover:bg-gray-200 transition-all">
              <h3 className="text-2xl font-semibold">Sentimental Analysis</h3>
              <p className="mt-2 text-gray-600">Gain insights into video comments to understand viewer reactions, helping you tailor content for better engagement.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-gray-100 hover:bg-gray-200 transition-all">
              <h3 className="text-2xl font-semibold">Evaluation Matrix</h3>
              <p className="mt-2 text-gray-600">Evaluate the effectiveness of generated titles with our Evaluation Matrix. This tool helps you assess performance using data-driven insights, ensuring your titles maximize engagement and reach.</p>
            </div>
          </div>
        </section>
      );
    };
  export default Services;