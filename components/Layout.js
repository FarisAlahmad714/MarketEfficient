import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from 'styled-components';
import { FaSun, FaMoon, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
  background: ${props => props.isDarkMode 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
    : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)'};
  color: ${props => props.isDarkMode ? '#e1e1e1' : '#333'};
`;

const Header = styled.header`
  background: ${props => props.isDarkMode ? '#0f0f1a' : 'white'};
  box-shadow: 0 2px 10px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.2' : '0.05'});
  padding: 20px 0;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.a`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.isDarkMode ? '#e1e1e1' : '#333'};
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
`;

const LogoIcon = styled.span`
  display: inline-block;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4CAF50, #2196F3);
  border-radius: 8px;
  margin-right: 10px;
`;

const NavBar = styled.nav`
  display: flex;
  align-items: center;
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 20px;
`;

const NavItem = styled.li``;

const NavLink = styled.a`
  color: ${props => props.active 
    ? '#2196F3' 
    : props.isDarkMode ? '#b0b0b0' : '#555'};
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '500'};
  padding: 8px 0;
  border-bottom: ${props => props.active ? '2px solid #2196F3' : 'none'};
  transition: color 0.3s ease;

  &:hover {
    color: #2196F3;
  }
`;

const ThemeToggle = styled.button`
  background: none;
  border: none;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#555'};
  font-size: 20px;
  cursor: pointer;
  margin-left: 20px;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease, background-color 0.3s ease;
  
  &:hover {
    color: #2196F3;
    background-color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const Main = styled.main`
  flex: 1;
`;

const Footer = styled.footer`
  background-color: ${props => props.isDarkMode ? '#0f0f1a' : '#fff'};
  padding: 40px 0;
  border-top: 1px solid ${props => props.isDarkMode ? '#222' : '#eee'};
  margin-top: 60px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
`;

const Copyright = styled.p`
  margin: 0;
`;

const SocialList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 15px;
`;

const SocialItem = styled.li``;

const SocialLink = styled.a`
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
  font-size: 24px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #2196F3;
  }
`;

const Layout = ({ children }) => {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    // Add FontAwesome script if it's not already present
    if (!document.querySelector('#fontawesome-script')) {
      const script = document.createElement('script');
      script.id = 'fontawesome-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js';
      script.integrity = 'sha512-Tn2m0TIpgVyTzzvmxLNuqbSJH3JP8jm+Cy3hvHrW7ndTDcJ1w5mBiksqDBb8GpE2ksktFvDB/ykZ0mDpsZj20w==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Container isDarkMode={isDarkMode}>
      <Header isDarkMode={isDarkMode}>
        <HeaderContent>
          <Link href="/" passHref>
            <Logo isDarkMode={isDarkMode}>
              <LogoIcon />
              Trading Platform
            </Logo>
          </Link>

          <NavBar>
            <NavList>
              <NavItem>
                <Link href="/" passHref>
                  <NavLink active={router.pathname === '/'} isDarkMode={isDarkMode}>
                    Home
                  </NavLink>
                </Link>
              </NavItem>
              <NavItem>
                <Link href="/bias-test" passHref>
                  <NavLink active={router.pathname.includes('/bias-test')} isDarkMode={isDarkMode}>
                    Bias Test
                  </NavLink>
                </Link>
              </NavItem>
            </NavList>
            <ThemeToggle 
              onClick={toggleTheme} 
              isDarkMode={isDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </ThemeToggle>
          </NavBar>
        </HeaderContent>
      </Header>

      <Main>
        {children}
      </Main>

      <Footer isDarkMode={isDarkMode}>
        <FooterContent isDarkMode={isDarkMode}>
          <div>
            <Copyright>© 2025 Trading Platform. All rights reserved.</Copyright>
          </div>
          <div>
            <SocialList>
              <SocialItem>
                <SocialLink href="#" isDarkMode={isDarkMode}>
                  <FaTwitter />
                </SocialLink>
              </SocialItem>
              <SocialItem>
                <SocialLink href="#" isDarkMode={isDarkMode}>
                  <FaLinkedin />
                </SocialLink>
              </SocialItem>
              <SocialItem>
                <SocialLink href="#" isDarkMode={isDarkMode}>
                  <FaGithub />
                </SocialLink>
              </SocialItem>
            </SocialList>
          </div>
        </FooterContent>
      </Footer>
    </Container>
  );
};

export default Layout; 