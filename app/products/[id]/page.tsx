'use client'
import EditProduct from "@/app/components/Edit";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // 👈 On utilise `use()` pour attendre `params`
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
 const [user, setUser] = useState(null);
  const router = useRouter();
   useEffect(() => {
        const fetchUser = async () => {
          try {
            const response = await fetch('/api/user'); // Endpoint pour récupérer l'utilisateur
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
    
              // 🔐 Vérifie si l'utilisateur n'est pas admin
              if (!userData.admin) {
                router.push('/'); // Redirige vers l'accueil si pas admin
              }
            } else {
              router.push('/login'); // Redirige vers login si non connecté
            }
          } catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            router.push('/login'); // Redirige en cas d'erreur
          }
        };
    
        setTimeout(fetchUser, 1000); // Attendre 1 seconde avant d'exécuter fetchUser
      }, [router]);
  return <EditProduct id={id} />;
}
