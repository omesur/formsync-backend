import { Test, TestingModule } from '@nestjs/testing';
import { FormInstanceController } from './form-instance.controller';

describe('FormInstanceController', () => {
  let controller: FormInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormInstanceController],
    }).compile();

    controller = module.get<FormInstanceController>(FormInstanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
