   import { supabase } from "../supabaseClient";

   // Haalt een lijst op uit Supabase (bijvoorbeeld "orders"). Geeft null als er niets is.
   export async function laadGegevens(naam) {
     const { data, error } = await supabase
       .from("gegevens")
       .select("data")
       .eq("naam", naam)
       .maybeSingle();

     if (error) {
       console.error("Laden mislukt voor " + naam, error);
       return null;
     }
     return data ? data.data : null;
   }

   // Bewaart een lijst in Supabase. Geeft true als het gelukt is.
   export async function bewaarGegevens(naam, waarde) {
     const { error } = await supabase.from("gegevens").upsert({
       naam: naam,
       data: waarde,
       bijgewerkt: new Date().toISOString(),
     });

     if (error) {
       console.error("Bewaren mislukt voor " + naam, error);
       return false;
     }
     return true;
   }