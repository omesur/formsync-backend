import { Test, TestingModule } from '@nestjs/testing';
import { FormInstanceService } from './form-instance.service';

describe('FormInstanceService', () => {
  let service: FormInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormInstanceService],
    }).compile();

    service = module.get<FormInstanceService>(FormInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
