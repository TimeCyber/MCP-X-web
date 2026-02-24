import React from 'react';
import { Server } from '../../types';

import { VerifiedBadge } from './VerifiedBadge';
import { UsageBadge } from './UsageBadge';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface ServerCardProps {
  server: Server;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const { currentLanguage } = useLanguage();
  


  return (
    <Link 
      to={`/server/${server.id}`}
      className="block w-full rounded-lg transition-all duration-200 p-4 h-[250px] flex flex-col border backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30 shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center group-hover:text-orange-500">
          {currentLanguage === 'zh' 
            ? (server.chineseName || server.nameCn || server.name) 
            : (server.name || server.nameEn || server.chineseName || server.nameCn)
          }
          {server.verified && <span className="ml-1"><VerifiedBadge /></span>}
          {server.new && <span className="ml-2 text-xs bg-orange-500 text-black px-1.5 py-0.5 rounded-full">NEW</span>}
        </h3>
      </div>
      
      <div className="text-sm text-gray-400 mb-3 break-all">
        {server.handle}
      </div>
      
      <p className="text-gray-300 mb-4 line-clamp-4">
        {currentLanguage === 'zh' 
          ? (server.descriptionCn || server.description || server.descriptionEn || '') 
          : (server.descriptionEn || server.description || server.descriptionCn || '')
        }
      </p>
      
      <div className="flex justify-between items-center mt-auto">
        {/* <div className="flex space-x-2">
          {server.tags.map((tag, index) => (
            <Badge key={index} type={tag} />
          ))}
        </div> */}
        <UsageBadge count={server.usageLabel} />
      </div>
    </Link>
  );
};