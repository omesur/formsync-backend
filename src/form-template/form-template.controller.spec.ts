import { Test, TestingModule } from '@nestjs/testing';
import { FormTemplateController } from './form-template/form-template.controller';

describe('FormTemplateController', () => {
  let controller: FormTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormTemplateController],
    }).compile();

    controller = module.get<FormTemplateController>(FormTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
