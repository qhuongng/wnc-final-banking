"use client";

import { useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";

import { useAppDispatch, useAppSelector } from "@/lib/hooks/withTypes";
import { getUserAccountThunk } from "@/lib/thunks/customer/AccountThunks";
import { makeToast } from "@/lib/utils/customer";
import { createRequestThunk } from "@/lib/thunks/customer/TransactionsThunk";

import {
    Button,
    NumberInput,
    Textarea,
    Group,
    Modal,
    Input,
    ActionIcon,
    Tooltip,
    NumberInputHandlers,
    Stack,
} from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconMessageDollar } from "@tabler/icons-react";

import SelectPopover from "./SelectPopover";

interface CreateModalProps {
    targetAccountNumber?: string;
    isFromReceiversList: boolean;
}

const CreateRequestModal: React.FC<CreateModalProps> = ({
    targetAccountNumber,
    isFromReceiversList,
}) => {
    const dispatch = useAppDispatch();
    const userAccount = useAppSelector((state) => state.account.customerAccount);

    const [opened, { open, close }] = useDisclosure(false);

    // for NumberInput increment and decrement functions
    const handlersRef = useRef<NumberInputHandlers>(null);

    const form = useForm({
        mode: "uncontrolled",
        validateInputOnBlur: true,
        initialValues: {
            targetAccountNumber: targetAccountNumber || "",
            amount: 0,
            message: "Nhac thanh toan no",
        },
        validate: {
            targetAccountNumber: (value) =>
                value.length < 1
                    ? "Vui lòng nhập số tài khoản người nhận"
                    : /[0-9\s]{14}/.test(value)
                    ? null
                    : "Số tài khoản người nhận không hợp lệ",
            amount: (value) => (value < 10000 ? "Số tiền nợ tối thiểu là 10000 VND" : null),
            message: isNotEmpty("Vui lòng nhập nội dung nhắc nợ"),
        },
        transformValues: (values) => ({
            ...values,
            target: values.targetAccountNumber.split(" ").join(""),
            message: values.message.trim(),
        }),
    });

    const handleSubmit = async (values: typeof form.values) => {
        try {
            const newRequest = {
                amount: values.amount,
                description: values.message,
                sourceAccountNumber: userAccount?.accountNumber || "",
                targetAccountNumber: values.targetAccountNumber.split(" ").join(""),
                type: "debt_payment",
            };

            await dispatch(createRequestThunk(newRequest)).unwrap();

            makeToast(
                "success",
                "Tạo nhắc nợ thành công",
                "Bạn có thể xem chi tiết tại trang Nhắc nợ."
            );
        } catch (error) {
            makeToast("error", "Tạo nhắc nợ thất bại", (error as Error).message);
        }

        handleModalClose();
    };

    const handleModalClose = () => {
        close();
        form.reset();
    };

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                await dispatch(getUserAccountThunk()).unwrap();
            } catch (error) {
                makeToast(
                    "error",
                    "Truy vấn thông tin tài khoản thất bại",
                    (error as Error).message
                );
            }
        };

        if (userAccount === null) {
            fetchAccount();
        }

        form.setFieldValue("message", `${userAccount?.name} nhac thanh toan no`);
    }, [dispatch, userAccount]);

    return (
        <>
            <Modal
                opened={opened}
                onClose={handleModalClose}
                title="Tạo nhắc nợ mới"
                radius="md"
                centered
                styles={{
                    title: {
                        fontWeight: 700,
                        fontSize: "var(--mantine-font-size-lg)",
                    },
                    content: {
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingTop: 5,
                        paddingBottom: 5,
                    },
                }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Input.Wrapper size="md" mt="lg" label="Số tài khoản người nợ" withAsterisk>
                        <Input
                            component={IMaskInput}
                            size="md"
                            radius="md"
                            mask="0000 0000 0000"
                            placeholder="XXXX XXXX XXXX"
                            rightSectionPointerEvents="all"
                            error={form.errors.target}
                            key={form.key("targetAccountNumber")}
                            {...form.getInputProps("targetAccountNumber")}
                            rightSection={<SelectPopover form={form} />}
                        />
                    </Input.Wrapper>

                    <Stack mt="lg" gap="md">
                        <NumberInput
                            size="md"
                            radius="md"
                            label="Số tiền nợ"
                            withAsterisk
                            handlersRef={handlersRef}
                            step={10000}
                            allowNegative={false}
                            allowDecimal={false}
                            hideControls
                            decimalSeparator=","
                            thousandSeparator="."
                            suffix=" ₫"
                            key={form.key("amount")}
                            {...form.getInputProps("amount")}
                        />

                        <Group grow mb={form.errors.amount ? "lg" : 0}>
                            <Button
                                radius="md"
                                size="md"
                                onClick={() => handlersRef.current?.decrement()}
                                variant="outline"
                            >
                                -10.000 ₫
                            </Button>

                            <Button
                                radius="md"
                                size="md"
                                onClick={() => handlersRef.current?.increment()}
                                variant="outline"
                            >
                                +10.000 ₫
                            </Button>
                        </Group>
                    </Stack>

                    <Textarea
                        size="md"
                        radius="md"
                        mt="lg"
                        label="Nội dung nhắc nợ"
                        withAsterisk
                        placeholder="Nhắc trả nợ ngày DD/MM/YYYY"
                        autosize
                        minRows={2}
                        maxRows={4}
                        key={form.key("message")}
                        {...form.getInputProps("message")}
                    />

                    <Group mt="lg" justify="flex-end">
                        <Button radius="md" onClick={handleModalClose} variant="default">
                            Hủy
                        </Button>

                        <Button radius="md" type="submit" variant="filled">
                            Tạo nhắc nợ
                        </Button>
                    </Group>
                </form>
            </Modal>

            {isFromReceiversList ? (
                <Tooltip label="Nhắc nợ">
                    <ActionIcon radius="md" variant="subtle" color="blue" onClick={open}>
                        <IconMessageDollar size={20} />
                    </ActionIcon>
                </Tooltip>
            ) : (
                <Button radius="md" size="md" maw={200} onClick={open}>
                    Tạo nhắc nợ mới
                </Button>
            )}
        </>
    );
};

export default CreateRequestModal;
