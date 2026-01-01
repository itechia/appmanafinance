"use client"

import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProGateProps {
    children: React.ReactNode
    featureName: string
    description: string
}

export function ProGate({ children, featureName, description }: ProGateProps) {
    const { currentUser } = useUser()
    const router = useRouter()

    if (currentUser?.plan === "pro") {
        return <>{children}</>
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in duration-500">
            <Card className="max-w-md w-full border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

                <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        Recurso Pro
                        <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {featureName} é exclusivo para assinantes Pro.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                    <Button
                        size="lg"
                        className="w-full gap-2 font-bold shadow-md shadow-primary/20"
                        onClick={() => router.push("/pricing")}
                    >
                        <Crown className="h-4 w-4" />
                        Fazer Upgrade Agora
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
