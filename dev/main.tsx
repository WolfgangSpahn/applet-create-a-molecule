import { render } from 'solid-js/web';
import App from './App';

render(
  () => <App />,
  document.getElementById('root')! // Non-null assertion since we expect this element to exist.
);