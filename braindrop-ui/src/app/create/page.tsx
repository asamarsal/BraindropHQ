"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, ArrowRight, Coins, Trophy, Users, Pencil, Percent, Equal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Topbar from "@/components/custom/topbar"
import { toast } from "sonner"

export default function CreateQuizPage() {
    const router = useRouter()
    const [rewardPool, setRewardPool] = useState("")
    const [distributionMode, setDistributionMode] = useState("percentage")
    const [winnerCount, setWinnerCount] = useState("3")
    const [customPrize1st, setCustomPrize1st] = useState("")
    const [customPrize2nd, setCustomPrize2nd] = useState("")
    const [customPrize3rd, setCustomPrize3rd] = useState("")

    // Validation helper
    const validateNumberInput = (value: string) => {
        if (value === "") return true;

        const num = parseFloat(value);
        if (isNaN(num)) {
            toast.error("Input must be number");
            return false;
        }
        if (num < 0) {
            toast.error("Input cannot minus");
            return false;
        }
        return true;
    }

    // Mock calculation for preview
    const calculatePreview = (index: number) => {
        const total = parseFloat(rewardPool) || 0;

        if (distributionMode === 'custom') {
            const customPrizes = [customPrize1st, customPrize2nd, customPrize3rd];
            return (parseFloat(customPrizes[index]) || 0).toFixed(2);
        }

        if (distributionMode === 'equal') {
            return (total / parseInt(winnerCount)).toFixed(2);
        }
        // Percentage hardcoded for demo: 50%, 30%, 20%
        const percentages = [0.5, 0.3, 0.2];
        if (percentages[index]) {
            return (total * percentages[index]).toFixed(2);
        }
        return "0.00";
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            <Topbar />

            <div className="flex-1 p-4 md:p-8 flex flex-col items-center pt-40">
                <div className="w-full max-w-7xl space-y-8 mt-12">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-400 hover:text-white">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">New Quiz Setup</h1>
                        <div className="w-20" /> {/* Spacer */}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        {/* Reward Pool Input Card */}
                        <Card className="bg-slate-900 border-slate-800 shadow-xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <Coins className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    Total Prize Pool
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Set the total rewards to be distributed
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <Label htmlFor="amount" className="text-slate-300 mb-2 block">Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={rewardPool}
                                            onChange={(e) => {
                                                if (validateNumberInput(e.target.value)) {
                                                    setRewardPool(e.target.value);
                                                }
                                            }}
                                            className="bg-slate-950 border-slate-700 text-2xl h-14 text-white focus-visible:ring-purple-500"
                                            placeholder="Input amount"
                                        />
                                    </div>

                                    <div className="w-32">
                                        <Label className="text-slate-300 mb-2 block">Currency</Label>
                                        <div className="h-14 flex items-center justify-center bg-slate-950 border border-slate-700 rounded-md text-slate-400 font-mono">
                                            $ / Token
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Summary */}
                                <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Prize Pool (Net)</span>
                                        <span className="font-mono">
                                            {distributionMode === 'custom'
                                                ? ((parseFloat(customPrize1st || "0") + parseFloat(customPrize2nd || "0") + parseFloat(customPrize3rd || "0")).toFixed(2))
                                                : parseFloat(rewardPool || "0").toFixed(2)
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Platform Fee (2%)</span>
                                        <span className="font-mono text-purple-400">
                                            + {distributionMode === 'custom'
                                                ? ((parseFloat(customPrize1st || "0") + parseFloat(customPrize2nd || "0") + parseFloat(customPrize3rd || "0")) * 0.02).toFixed(2)
                                                : (parseFloat(rewardPool || "0") * 0.02).toFixed(2)
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Gas Fee (Est. 2%)</span>
                                        <span className="font-mono text-blue-400">
                                            + {distributionMode === 'custom'
                                                ? ((parseFloat(customPrize1st || "0") + parseFloat(customPrize2nd || "0") + parseFloat(customPrize3rd || "0")) * 0.02).toFixed(2)
                                                : (parseFloat(rewardPool || "0") * 0.02).toFixed(2)
                                            }
                                        </span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between font-bold text-white">
                                        <span>Total Required</span>
                                        <span className="font-mono text-lg text-green-400">
                                            {distributionMode === 'custom'
                                                ? ((parseFloat(customPrize1st || "0") + parseFloat(customPrize2nd || "0") + parseFloat(customPrize3rd || "0")) * 1.04).toFixed(2)
                                                : (parseFloat(rewardPool || "0") * 1.04).toFixed(2)
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Distribution Mode Card */}
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-400" />
                                    </div>
                                    Distribution Mode
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    How should rewards be split among winners?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">

                                {/* Mode Selection */}
                                <RadioGroup value={distributionMode} onValueChange={setDistributionMode} className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* Equal Split */}
                                    <label className={`
                    cursor-pointer relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all
                    ${distributionMode === 'equal' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}
                 `}>
                                        <RadioGroupItem value="equal" className="sr-only" />
                                        <div className="mb-4 p-3 rounded-full bg-slate-800 text-white">
                                            <Equal className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-lg mb-1 text-white">Equal Split</span>
                                        <span className="text-xs text-slate-400">Same amount each</span>
                                    </label>

                                    {/* Percentage */}
                                    <label className={`
                    cursor-pointer relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all
                    ${distributionMode === 'percentage' ? 'border-red-500 bg-red-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}
                 `}>
                                        <RadioGroupItem value="percentage" className="sr-only" />
                                        <div className="mb-4 p-3 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30">
                                            <Percent className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-lg mb-1 text-white">Percentage</span>
                                        <span className="text-xs text-slate-400">50/30/20 split</span>
                                    </label>

                                    {/* Custom */}
                                    <label className={`
                    cursor-pointer relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all
                    ${distributionMode === 'custom' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}
                 `}>
                                        <RadioGroupItem value="custom" className="sr-only" />
                                        <div className="mb-4 p-3 rounded-full bg-slate-800 text-white">
                                            <div className="relative">
                                                <Pencil className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <span className="font-bold text-lg mb-1 text-white">Custom</span>
                                        <span className="text-xs text-slate-400">Set each amount</span>
                                    </label>

                                </RadioGroup>

                                {/* Custom Prize Inputs */}
                                {distributionMode === 'custom' && (
                                    <div className="space-y-4 p-6 bg-slate-950/50 rounded-lg border border-slate-800">
                                        <h4 className="text-sm font-medium text-slate-300 mb-4">Set Individual Prizes</h4>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-sm text-slate-900 shrink-0">
                                                    1
                                                </div>
                                                <Label className="text-slate-300 min-w-[80px]">1st Place</Label>
                                                <Input
                                                    type="number"
                                                    value={customPrize1st}
                                                    onChange={(e) => {
                                                        if (validateNumberInput(e.target.value)) {
                                                            setCustomPrize1st(e.target.value);
                                                        }
                                                    }}
                                                    placeholder="Enter amount"
                                                    className="bg-slate-900 border-slate-700 text-white h-10"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center font-bold text-sm text-slate-900 shrink-0">
                                                    2
                                                </div>
                                                <Label className="text-slate-300 min-w-[80px]">2nd Place</Label>
                                                <Input
                                                    type="number"
                                                    value={customPrize2nd}
                                                    onChange={(e) => {
                                                        if (validateNumberInput(e.target.value)) {
                                                            setCustomPrize2nd(e.target.value);
                                                        }
                                                    }}
                                                    placeholder="Enter amount"
                                                    className="bg-slate-900 border-slate-700 text-white h-10"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-orange-700 flex items-center justify-center font-bold text-sm text-white shrink-0">
                                                    3
                                                </div>
                                                <Label className="text-slate-300 min-w-[80px]">3rd Place</Label>
                                                <Input
                                                    type="number"
                                                    value={customPrize3rd}
                                                    onChange={(e) => {
                                                        if (validateNumberInput(e.target.value)) {
                                                            setCustomPrize3rd(e.target.value);
                                                        }
                                                    }}
                                                    placeholder="Enter amount"
                                                    className="bg-slate-900 border-slate-700 text-white h-10"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white h-10"
                                            onClick={() => {
                                                const total = parseFloat(customPrize1st || "0") + parseFloat(customPrize2nd || "0") + parseFloat(customPrize3rd || "0");
                                                setRewardPool(total.toString());
                                                console.log('Custom prizes saved:', { customPrize1st, customPrize2nd, customPrize3rd, total });
                                            }}
                                        >
                                            Save Distribution
                                        </Button>
                                    </div>
                                )}

                                {/* Preview Section */}
                                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                                    <h3 className="text-sm font-medium text-slate-400 mb-4">Preview Distribution (Total: {rewardPool} MNT)</h3>
                                    <div className="space-y-4">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                    ${i === 0 ? 'bg-amber-500 text-slate-900' :
                                                            i === 1 ? 'bg-slate-400 text-slate-900' :
                                                                'bg-orange-700 text-white'}
                                `}>
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-medium text-slate-200">
                                                        {i === 0 ? '1st Place' : i === 1 ? '2nd Place' : '3rd Place'}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-bold text-red-400 text-lg">
                                                    {calculatePreview(i)} MNT
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-lg font-bold shadow-lg shadow-red-500/25 rounded-xl border-0 mt-8"
                        onClick={() => router.push('/host')}
                    >
                        Continue to Quiz Settings <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
