import { Test, TestingModule } from '@nestjs/testing';
import { PexelsController } from './pexels.controller';

describe('PexelsController', () => {
  let controller: PexelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PexelsController],
    }).compile();

    controller = module.get<PexelsController>(PexelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
