"use client";

import { Stack, Group } from "@mantine/core";
import { IconUserPlus, IconHistory, IconCreditCardPay } from "@tabler/icons-react";
import SideMenu from "@/components/SideMenu";
import StaffPortalShortcut from "./components/StaffPortalShortcut";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks/withTypes";
import Loading from "@/components/Loading";

const menuItems = [
    {
        link: "/staff/employee/create-account",
        label: "Tạo tài khoản khách hàng",
        icon: <IconUserPlus />,
        top: true,
    },
    {
        link: "/staff/employee/deposit",
        label: "Nạp tiền vào tài khoản",
        icon: <IconCreditCardPay />,
        top: true,
    },
    {
        link: "/staff/employee/transaction-history",
        label: "Lịch sử giao dịch",
        icon: <IconHistory />,
        top: true,
    },
];

export default function EmployeeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();
    const role = useAppSelector((state) => state.auth.authUser?.role);
    const [isCheckingRole, setIsCheckingRole] = useState(true);

    useEffect(() => {
        if (!role) {
            setIsCheckingRole(true);
            return;
        }

        if (role !== "staff") {
            router.push("/staff/admin/employee-list");
        } else {
            setIsCheckingRole(false);
        }
    }, [role, router]);

    if (isCheckingRole) {
        return <Loading />;
    }

    return (
        <Group align="top" preventGrowOverflow={false} grow gap="0" wrap="nowrap">
            <SideMenu forCustomer={false} items={menuItems} />
            <Stack>
                <Group justify="flex-end" mr={40} mt={10}>
                    <StaffPortalShortcut />
                </Group>
                {children}
            </Stack>
        </Group>
    );
}
