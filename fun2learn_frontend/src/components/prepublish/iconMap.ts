import {
    Trophy, Star, Medal, Award, Crown, Gem, Diamond,
    Flame, Zap, Rocket, Target, Shield, ShieldCheck,
    GraduationCap, BookOpen, Brain, Lightbulb, Sparkles,
    Heart, ThumbsUp, PartyPopper, Gift, Music,
    Code, Terminal, Globe, Cpu, Database, Atom,
    Palette, PenTool, Camera, Film, Gamepad2,
    Mountain, Trees, Compass, Map, Anchor, Sailboat, Sun, Moon,
    Bug, Cat, Dog, Bird, Fish,
    type LucideIcon,
} from "lucide-react";

export interface BadgeIconEntry {
    name: string;
    icon: LucideIcon;
    category: string;
}

export const BADGE_ICONS: BadgeIconEntry[] = [
    // Achievement
    { name: "Trophy", icon: Trophy, category: "Achievement" },
    { name: "Star", icon: Star, category: "Achievement" },
    { name: "Medal", icon: Medal, category: "Achievement" },
    { name: "Award", icon: Award, category: "Achievement" },
    { name: "Crown", icon: Crown, category: "Achievement" },
    { name: "Gem", icon: Gem, category: "Achievement" },
    { name: "Diamond", icon: Diamond, category: "Achievement" },
    // Energy
    { name: "Flame", icon: Flame, category: "Energy" },
    { name: "Zap", icon: Zap, category: "Energy" },
    { name: "Rocket", icon: Rocket, category: "Energy" },
    { name: "Target", icon: Target, category: "Energy" },
    { name: "Shield", icon: Shield, category: "Energy" },
    { name: "ShieldCheck", icon: ShieldCheck, category: "Energy" },
    // Education
    { name: "GraduationCap", icon: GraduationCap, category: "Education" },
    { name: "BookOpen", icon: BookOpen, category: "Education" },
    { name: "Brain", icon: Brain, category: "Education" },
    { name: "Lightbulb", icon: Lightbulb, category: "Education" },
    { name: "Sparkles", icon: Sparkles, category: "Education" },
    // Emotion
    { name: "Heart", icon: Heart, category: "Emotion" },
    { name: "ThumbsUp", icon: ThumbsUp, category: "Emotion" },
    { name: "PartyPopper", icon: PartyPopper, category: "Emotion" },
    { name: "Gift", icon: Gift, category: "Emotion" },
    { name: "Music", icon: Music, category: "Emotion" },
    // Tech
    { name: "Code", icon: Code, category: "Tech" },
    { name: "Terminal", icon: Terminal, category: "Tech" },
    { name: "Globe", icon: Globe, category: "Tech" },
    { name: "Cpu", icon: Cpu, category: "Tech" },
    { name: "Database", icon: Database, category: "Tech" },
    { name: "Atom", icon: Atom, category: "Tech" },
    // Creative
    { name: "Palette", icon: Palette, category: "Creative" },
    { name: "PenTool", icon: PenTool, category: "Creative" },
    { name: "Camera", icon: Camera, category: "Creative" },
    { name: "Film", icon: Film, category: "Creative" },
    { name: "Gamepad2", icon: Gamepad2, category: "Creative" },
    // Nature
    { name: "Mountain", icon: Mountain, category: "Nature" },
    { name: "Trees", icon: Trees, category: "Nature" },
    { name: "Compass", icon: Compass, category: "Nature" },
    { name: "Map", icon: Map, category: "Nature" },
    { name: "Anchor", icon: Anchor, category: "Nature" },
    { name: "Sailboat", icon: Sailboat, category: "Nature" },
    { name: "Sun", icon: Sun, category: "Nature" },
    { name: "Moon", icon: Moon, category: "Nature" },
    // Fun
    { name: "Bug", icon: Bug, category: "Fun" },
    { name: "Cat", icon: Cat, category: "Fun" },
    { name: "Dog", icon: Dog, category: "Fun" },
    { name: "Bird", icon: Bird, category: "Fun" },
    { name: "Fish", icon: Fish, category: "Fun" },
];

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
    BADGE_ICONS.map((entry) => [entry.name, entry.icon])
);

export const ICON_CATEGORIES = [...new Set(BADGE_ICONS.map((e) => e.category))];
