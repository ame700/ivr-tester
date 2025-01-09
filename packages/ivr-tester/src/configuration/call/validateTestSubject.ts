import Joi, { ValidationError, ValidationResult } from "joi";
import { IvrNumber } from "./IvrNumber";
import { GenesysNumber } from "./GenesysNumber";

const schema = Joi.object<IvrNumber>({
  from: Joi.string().required(),
  to: Joi.string().required(),
});

const genesysSchema = Joi.object<GenesysNumber>({
  to: Joi.string().required(),
});
 
export type TestSubject = IvrNumber  | Buffer | GenesysNumber;

export const validateTestSubject = (
  testSubject: TestSubject
): { error?: ValidationError } => {
  if (Buffer.isBuffer(testSubject)) {
    return {};
  }

  if (!(testSubject as IvrNumber).from) { // from is not required fro genesys
    return genesysSchema.validate(testSubject, {
      presence: "required",
    });
  }

  return schema.validate(testSubject, {
    presence: "required",
  });
};
