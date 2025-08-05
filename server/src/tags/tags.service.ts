import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const existingTag = await this.tagsRepository.findOneBy({ name: createTagDto.name });
    if (existingTag) {
      throw new ConflictException('Tag with this name already exists');
    }
    const newTag = this.tagsRepository.create(createTagDto);
    return this.tagsRepository.save(newTag);
  }

  findAll(): Promise<Tag[]> {
    return this.tagsRepository.find();
  }
}