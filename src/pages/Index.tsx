import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    window.location.href = "/math-tutor.html";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-xl text-muted-foreground">Loading Math Tutor AI...</p>
      </div>
    </div>
  );
};

export default Index;
