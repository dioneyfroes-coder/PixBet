import { redirect } from 'react-router';
import type { Route } from './+types/jogos';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const suffix = url.search ? `${url.search}` : '';
  return redirect(`/games${suffix}`);
}

export default function JogosRedirect() {
  return null;
}
