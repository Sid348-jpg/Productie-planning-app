   import { useState } from "react";
   import { supabase } from "../supabaseClient";

   function Login() {
     const [email, setEmail] = useState("");
     const [wachtwoord, setWachtwoord] = useState("");
     const [toonWachtwoord, setToonWachtwoord] = useState(false);
     const [fout, setFout] = useState("");
     const [bezig, setBezig] = useState(false);

     async function inloggen(e) {
       e.preventDefault();
       setBezig(true);
       setFout("");

       const { error } = await supabase.auth.signInWithPassword({
         email: email,
         password: wachtwoord,
       });

       if (error) {
         setFout("Inloggen mislukt: controleer je e-mailadres en wachtwoord.");
       }
       setBezig(false);
     }

     return (
       <div
         style={{
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
           minHeight: "100vh",
           fontFamily: "Arial, sans-serif",
           background: "#f3f4f6",
         }}
       >
         <form
           onSubmit={inloggen}
           style={{
             background: "white",
             padding: "30px",
             borderRadius: "8px",
             width: "320px",
             display: "flex",
             flexDirection: "column",
             gap: "12px",
             boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
           }}
         >
           <h2 style={{ margin: 0 }}>Productieplanning</h2>

           <input
             type="email"
             name="email"
             autoComplete="username"
             placeholder="E-mailadres"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             style={{ padding: "10px", fontSize: "14px" }}
           />

           <input
             type={toonWachtwoord ? "text" : "password"}
             name="password"
             autoComplete="current-password"
             placeholder="Wachtwoord"
             value={wachtwoord}
             onChange={(e) => setWachtwoord(e.target.value)}
             required
             style={{ padding: "10px", fontSize: "14px" }}
           />

           <label style={{ fontSize: "13px", cursor: "pointer" }}>
             <input
               type="checkbox"
               checked={toonWachtwoord}
               onChange={(e) => setToonWachtwoord(e.target.checked)}
               style={{ marginRight: "6px" }}
             />
             Wachtwoord tonen
           </label>

           {fout && <div style={{ color: "red", fontSize: "13px" }}>{fout}</div>}

           <button
             type="submit"
             disabled={bezig}
             style={{
               padding: "10px",
               fontSize: "14px",
               background: "#111",
               color: "white",
               border: "none",
               borderRadius: "4px",
               cursor: "pointer",
             }}
           >
             {bezig ? "Bezig..." : "Inloggen"}
           </button>
         </form>
       </div>
     );
   }

   export default Login;