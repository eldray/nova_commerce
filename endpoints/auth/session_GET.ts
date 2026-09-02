import { getSessionUser } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    console.log('Session GET called');
    const user = await getSessionUser(request);
    console.log('Session user found:', !!user);
    
    return new Response(
      JSON.stringify({ user: user || null }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("session GET error:", error);
    return new Response(
      JSON.stringify({ user: null }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
