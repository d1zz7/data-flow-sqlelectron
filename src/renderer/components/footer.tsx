import React, { FC } from 'react';

interface Props {
  status: string;
}

const Footer: FC<Props> = () => {
  return (
    <div className="ui bottom fixed menu borderless" style={{ minHeight: 'auto', padding: 5 }}>
      <p style={{ marginLeft: 5, color: 'whitesmoke' }}>© Data Flow 2024 | Muhametov Tahir</p>
    </div>
  );
};

Footer.displayName = 'Footer';

export default Footer;
