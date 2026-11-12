import { Star, Users, Music, Trophy } from 'lucide-react';

export default function AboutSection() {
  const highlights = [
    { icon: Users, label: 'Students', value: '1000+', color: 'text-purple-400' },
    { icon: Music, label: 'Performances', value: 'Live', color: 'text-blue-400' },
    { icon: Star, label: 'Departments', value: '6', color: 'text-pink-400' },
    { icon: Trophy, label: 'Memories', value: '∞', color: 'text-yellow-400' },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/30 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">About Freshers 2026</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              A Grand Welcome to{' '}
              <span className="gradient-text">New Students</span>
            </h2>
            <p className="text-slate-400 text-lg mb-6 leading-relaxed">
              Freshers 2026 is the official welcome event organized by Jayawantrao Sawant 
              College of Engineering for all first-year students. It is a celebration of 
              new beginnings, lasting friendships, and the start of an incredible academic journey.
            </p>
            <p className="text-slate-400 text-lg mb-6 leading-relaxed">
              Experience an unforgettable evening with live performances, cultural activities, 
              interactive games, and much more — all organized by your senior students 
              to make you feel at home in your new college family.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Live Music', 'Dance Performances', 'Cultural Events', 'Games', 'Networking'].map((tag) => (
                <span
                  key={tag}
                  className="bg-purple-900/30 border border-purple-700/30 text-purple-300 px-4 py-1.5 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right stats */}
          <div className="grid grid-cols-2 gap-6">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="glass rounded-2xl p-6 card-hover text-center"
                >
                  <Icon className={`w-8 h-8 ${item.color} mx-auto mb-4`} />
                  <div className={`text-4xl font-black ${item.color} mb-1`}>{item.value}</div>
                  <div className="text-slate-400 text-sm">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

