import { Link } from 'react-router-dom';
import { Scale, Eye, Search, Shield, Activity } from 'lucide-react';

const raiCategories = [
  { title: 'Fairness First', icon: Scale, link: '/responsible-ai#fairness' },
  { title: 'Human Oversight', icon: Eye, link: '/responsible-ai#oversight' },
  { title: 'Transparency & Disclosure', icon: Search, link: '/responsible-ai#transparency' },
  { title: 'Privacy Protection', icon: Shield, link: '/responsible-ai#privacy' },
  { title: 'Continuous Monitoring', icon: Activity, link: '/responsible-ai#monitoring' },
];

const ResponsibleAISection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8 text-white">Responsible AI</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
          How we safely, fairly, and reliably use AI in our approach.
          Learn about the principles that guide everything we build.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
          {raiCategories.map((category, index) => (
            <Link key={index} to={category.link} className="block w-full max-w-[280px]">
              <div className="bg-white rounded-lg p-6 text-center shadow-lg w-full transform hover:scale-105 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#FFF6F0] flex items-center justify-center rounded-full">
                    <category.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-[#374957] font-semibold text-lg">{category.title}</h3>
              </div>
            </Link>
          ))}

          <div className="flex justify-center items-center w-full max-w-[280px]">
            <Link
              to="/responsible-ai"
              className="inline-block px-8 py-3 bg-primary text-white rounded-full hover:bg-opacity-90 transition text-lg font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsibleAISection;
