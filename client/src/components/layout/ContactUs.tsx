import React from "react";

const ContactUs = () => {
    return (
      <section className="py-20 px-6 text-center bg-gray-50">
        <h2 className="text-4xl font-bold text-gray-800">Contact Us</h2>
        <p className="mt-4 text-lg text-gray-700">Have questions or want to work with us? Get in touch today!</p>
        <form className="mt-6 max-w-lg mx-auto space-y-4">
          <input type="text" placeholder="Your Name" className="w-full p-3 border rounded-lg" />
          <input type="email" placeholder="Your Email" className="w-full p-3 border rounded-lg" />
          <textarea placeholder="Your Message" className="w-full p-3 border rounded-lg h-32"></textarea>
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">Send Message</button>
        </form>
      </section>
      
    );
  };
  export default ContactUs;