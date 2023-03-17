import { jest } from "@jest/globals";
import voucherService from "services/voucherService";
import voucherRepository from "repositories/voucherRepository";
import { conflictError } from "utils/errorUtils";

describe("voucherService test suit", () => {
  it("should create voucher when given valid data", async () => {
    const newVoucherData = { id: 1, used: false, code: "aaa", discount: 10 };

    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockReturnValue(undefined);

    jest
      .spyOn(voucherService, "createVoucher")
      .mockImplementationOnce((): any => {
        return newVoucherData;
      });

    const createdVoucher = await voucherService.createVoucher(
      newVoucherData.code,
      newVoucherData.discount
    );

    expect(createdVoucher).not.toBeInstanceOf(Error);
  });

  it("should not be able to create a voucher", async () => {
    const voucher = { id: 1, used: false, code: "aaa", discount: 10 };

    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockResolvedValueOnce(voucher);

    jest
      .spyOn(voucherRepository, "createVoucher")
      .mockImplementationOnce((): any => {});

    const result = voucherService.createVoucher(voucher.code, voucher.discount);

    await expect(result).rejects.toEqual(
      conflictError("Voucher already exist.")
    );

    expect(voucherRepository.createVoucher).not.toBeCalled();
  });

  it("should apply voucher when given data is correct and is valid amount", async () => {
    const newVoucherData = { id: 1, used: false, code: "aaa", discount: 10 };
    const amount = 150;
    const finalAmount = amount - (amount * newVoucherData.discount) / 100;

    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockResolvedValueOnce(newVoucherData);

    jest
      .spyOn(voucherRepository, "useVoucher")
      .mockImplementationOnce((): any => {});

    const result = await voucherService.applyVoucher(
      newVoucherData.code,
      amount
    );

    expect(result).toEqual({
      amount,
      discount: newVoucherData.discount,
      finalAmount,
      applied: true,
    });
  });

  it("should not apply voucher when given data is incorrect and is valid amount", async () => {
    const newVoucherData = { id: 1, used: false, code: "aaa", discount: 0 };
    const amount = 150;

    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce(() => {
        return undefined;
      });

    const result = voucherService.applyVoucher(newVoucherData.code, amount);

    expect(result).rejects.toEqual(conflictError("Voucher does not exist."));
  });

  it("should not apply voucher when given data is correct and is invalid amount", async () => {
    const newVoucherData = { id: 1, used: false, code: "aaa", discount: 0 };
    const amount = 10;
    const finalAmount = amount - (amount * newVoucherData.discount) / 100;

    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return newVoucherData;
      });

    const response = await voucherService.applyVoucher(
      newVoucherData.code,
      amount
    );

    expect(response).toEqual({
      amount,
      discount: newVoucherData.discount,
      finalAmount,
      applied: false,
    });
  });
});
