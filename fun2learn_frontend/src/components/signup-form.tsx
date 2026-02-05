"use client";

import { useState, useRef, useEffect } from "react";
import Button from "./ui/button";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { UserRole, Gender } from "@/models/types";
import Image from "next/image";
import Dropdown from "./ui/dropdown";
import { SignUpRequest } from "@/models/requestModels";
import { toast } from "sonner";

interface SignUpRoleDropdownProps {
    role: UserRole;
    gender: Gender;
    onRoleChange: (role: UserRole) => void;
}

interface SignUpFromProps {
    isSigningUp: boolean;
    onSignUp: (data: SignUpRequest) => void;
}

/** 
 * Dynamic Dropdown that is used to select roles between tutor and learner.
 * Dynamically renders a clipart image of the avatar based on role & gender.
*/ 
const SignUpRoleDropdown = ({ role, gender, onRoleChange }: SignUpRoleDropdownProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const getImage = (role: UserRole, gender: Gender): string => {
        return `/images/${role}-${gender === "female" ? gender : "male"}.png`;
    };

    const roles: UserRole[] = ['learner', 'tutor'];

    const handleRoleSelect = (selectedRole: UserRole) => {
        onRoleChange(selectedRole);
        setIsOpen(false);
    };

    const imageFile = getImage(role, gender);

    return (
        <div ref={dropdownRef} className="relative inline-block rounded-md border border-custom-gray">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 pt-2 bg-primary rounded-lg transition-colors min-w-37.5"
            >
                <Image
                    src={imageFile}
                    alt={role}
                    width={32}
                    height={32}
                />
                <span className="capitalize flex-1 text-left">{role}</span>
                <ChevronDown 
                    size={16} 
                    className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-100 dark:bg-indigo-900 rounded-lg shadow-lg overflow-hidden z-10">
                    {roles.map((roleOption) => (
                        <button
                            key={roleOption}
                            type="button"
                            onClick={() => handleRoleSelect(roleOption)}
                            className={`flex items-center gap-3 px-4 pt-2 w-full hover:bg-gray-200 dark:hover:bg-indigo-800 transition-colors ${
                                role === roleOption ? 'bg-gray-300 dark:bg-indigo-800' : ''
                            }`}
                        >
                            <Image
                                src={getImage(roleOption, gender)}
                                alt={roleOption}
                                width={32}
                                height={32}
                            />
                            <span className="capitalize">{roleOption}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SignUpForm = ({
    isSigningUp,
    onSignUp
}: SignUpFromProps) => {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<UserRole>("learner");
    const [selectedGender, setSelectedGender] = useState<Gender>("male");
    const [birthdate, setBirthdate] = useState<string>("");

    const genders: Gender[] = ['male', 'female', 'other'];

    const handleSubmit = () => {
        // Validate password confirmation
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const signupData: SignUpRequest = {
            fullName: name,
            email: email,
            password: password,
            birthday: birthdate,
            gender: selectedGender,
            role: selectedRole
        };
        onSignUp(signupData);
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex gap-2">
                <h1 className="font-lilita text-4xl self-center">Sign Up As </h1>
                <SignUpRoleDropdown 
                    role={selectedRole}
                    gender={selectedGender}
                    onRoleChange={setSelectedRole}
                />
            </div>
            <form onSubmit={(e) => {e.preventDefault(); handleSubmit()}} className="flex flex-col gap-4">
                <div className="flex flex-col">
                    <label className="mb-2">Name</label>
                    <input 
                        type="text" 
                        className="h-12 rounded-md border border-custom-gray px-2"
                        value={name}
                        name="name" 
                        placeholder="Enter your name" 
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col flex-1">
                        <label className="mb-2">Birthday</label>
                        <input 
                            type="date" 
                            className="h-12 rounded-md border border-custom-gray px-2"
                            value={birthdate}
                            name="birthdate" 
                            placeholder="Enter Birthday" 
                            onChange={(e) => setBirthdate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col flex-1">
                        <label className="mb-2">Gender</label>
                        <Dropdown
                            value={selectedGender}
                            options={genders}
                            onChange={(value) => setSelectedGender(value as Gender)}
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-2">Email</label>
                    <input 
                        type="email" 
                        className="h-12 rounded-md border border-custom-gray px-2"
                        value={email}
                        name="email" 
                        placeholder="Enter your email" 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="mb-2">Password</label>
                    <input 
                        type="password" 
                        className="h-12 rounded-md border border-custom-gray px-2"
                        value={password} 
                        name="password" 
                        placeholder="Enter your password" 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="mb-2">Confirm Password</label>
                    <input 
                        type="password" 
                        className="h-12 rounded-md border border-custom-gray px-2"
                        value={confirmPassword} 
                        name="confirmPassword" 
                        placeholder="Re-type password" 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <Button
                    className="font-lilita text-lg w-full"
                    type="submit"
                    isLoading={isSigningUp}
                    loadingText="Signing Up..."
                >
                    Sign Up
                </Button>

                <Link href="/login">
                    <p className="cursor-pointer hover:text-(--primary) text-center">Log In Instead</p>
                </Link>
            </form>
        </div>
    )
}