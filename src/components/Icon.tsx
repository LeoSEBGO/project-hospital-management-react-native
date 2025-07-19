import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const Icon: React.FC<IconProps> = ({
  name, 
  size = 24, 
  color = '#2c3e50',
  style 
}) => {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon; 