
import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DefaultListIcon: React.FC<IconProps> = ({ className, style }) => ( // Generic list icon
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm1.5 1.5A.75.75 0 015.25 6H6a.75.75 0 01.75.75v.042l1.594-1.594a.75.75 0 111.06 1.06L7.81 7.852l2.122 2.121a.75.75 0 11-1.061 1.06L6.75 8.914V10.5a.75.75 0 01-1.5 0V7.5zm5.096 1.52a.75.75 0 011.06-.02l3 3a.75.75 0 01-1.038 1.082L12.75 11.193V15a.75.75 0 01-1.5 0v-3.807l-1.934 1.934a.75.75 0 01-1.06-1.06l3-3a.75.75 0 01.02-.022zM9 12.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" clipRule="evenodd" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M6.25 4.75A.75.75 0 005.5 5.5V6.75h13V5.5A.75.75 0 0017.75 4.75h-11.5z" />
    <path fillRule="evenodd" d="M4 8.25A.75.75 0 003.25 9v8.25A2.25 2.25 0 005.5 19.5h13A2.25 2.25 0 0020.75 17.25V9a.75.75 0 00-.75-.75H4zm13.5 2.25a.75.75 0 000-1.5H6.5a.75.75 0 000 1.5h11z" clipRule="evenodd" />
  </svg>
);

export const PlanetIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M10.513 2.218a.75.75 0 01.454.693A10.439 10.439 0 0012.997 6a10.501 10.501 0 009.704 6.227.75.75 0 01.693.454l.117.274c.11.257.026.562-.194.719l-.832.594a10.456 10.456 0 00-2.35 2.526 10.414 10.414 0 00-.68 11.163.75.75 0 01-1.25.793L4.04 15.442a.75.75 0 01-.137-1.096l2.67-3.422a10.455 10.455 0 006.077-6.88.75.75 0 01.862-.526z" />
    <path d="M13.003 6a10.501 10.501 0 00-6.139 1.921l-2.67 3.422a.75.75 0 00.137 1.096l14.127 13.313a.75.75 0 001.25-.793 10.414 10.414 0 00.68-11.163 10.456 10.456 0 002.35-2.526l.832-.594a.75.75 0 00.194-.719l-.117-.274a.75.75 0 00-.693-.454A10.501 10.501 0 0013.003 6z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.543 2.862c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 101.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

export const LightBulbIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 7.758a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ className, style }) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);


export const LIST_ICON_MAP: { [key: string]: React.FC<IconProps> } = {
  default: DefaultListIcon,
  briefcase: BriefcaseIcon,
  planet: PlanetIcon,
  star: StarIcon,
  home: HomeIcon,
  heart: HeartIcon,
  lightbulb: LightBulbIcon,
  'shopping-bag': ShoppingBagIcon,
  // Add more as needed
};

export const AVAILABLE_LIST_ICONS = [
  { id: 'default', name: 'Default List', Icon: DefaultListIcon },
  { id: 'briefcase', name: 'Briefcase', Icon: BriefcaseIcon },
  { id: 'planet', name: 'Planet', Icon: PlanetIcon },
  { id: 'star', name: 'Star', Icon: StarIcon },
  { id: 'home', name: 'Home', Icon: HomeIcon },
  { id: 'heart', name: 'Heart', Icon: HeartIcon },
  { id: 'lightbulb', name: 'Idea', Icon: LightBulbIcon },
  { id: 'shopping-bag', name: 'Shopping', Icon: ShoppingBagIcon },
];