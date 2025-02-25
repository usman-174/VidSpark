import AboutUs from '@/components/layout/AboutUs'
import ContactUs from '@/components/layout/ContactUs'
import HeroSection from '@/components/layout/HeroSection'
import Services from '@/components/layout/Services'
import React from 'react'
import Footer from './Footer'
// import Audio from '@/components/Audio'
const Landing = () => {
  return (
    <>
    {/* <Audio/> */}
    <HeroSection />

      {/* About Us Section */}
      <AboutUs />

      {/* Our Services Section */}
      <Services />

      {/* Contact Us Section */}
      <ContactUs />
      
      <Footer/>
    </>
  )
}

export default Landing