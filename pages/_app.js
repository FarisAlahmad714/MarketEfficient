import { createGlobalStyle, ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider } from '../contexts/ThemeContext';
import Layout from '../components/Layout';

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    padding: 0;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }

  body {
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body.dark-mode {
    background-color: #121212;
    color: #e1e1e1;
  }

  body.light-mode {
    background-color: #ffffff;
    color: #333333;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* Custom scrollbar for dark mode */
  body.dark-mode::-webkit-scrollbar {
    width: 10px;
  }

  body.dark-mode::-webkit-scrollbar-track {
    background: #1e1e24;
  }

  body.dark-mode::-webkit-scrollbar-thumb {
    background: #3a3a44;
    border-radius: 10px;
  }

  body.dark-mode::-webkit-scrollbar-thumb:hover {
    background: #4a4a55;
  }
`;

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <StyledThemeProvider theme={{}}>
        <GlobalStyles />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </StyledThemeProvider>
    </ThemeProvider>
  );
}

export default MyApp; 