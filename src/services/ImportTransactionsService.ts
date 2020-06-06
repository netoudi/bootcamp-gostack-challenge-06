import * as fs from 'fs';
import { getCustomRepository } from 'typeorm';
import parse from 'csv-parse/lib/sync';

import Transaction from '../models/Transaction';
import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Record {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface RequestDTO {
  filepath: string;
}

class ImportTransactionsService {
  private categoriesRepository: CategoriesRepository;

  private transactionsRepository: TransactionsRepository;

  constructor() {
    this.categoriesRepository = getCustomRepository(CategoriesRepository);
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
  }

  async execute({ filepath }: RequestDTO): Promise<Transaction[]> {
    try {
      const importCSV = await fs.promises.readFile(filepath);

      const records: Record[] = parse(importCSV, {
        delimiter: ',',
        columns: true,
        trim: true,
        skip_empty_lines: true,
      });

      const recordsCategories = records.map(el => el.category);

      const promises = recordsCategories.map(category =>
        this.categoriesRepository.findByTitle(category),
      );

      const categories = await Promise.all(promises);

      const recordsSanitize = records.map(record => {
        const category = categories.find(el => el.title === record.category);

        return {
          title: record.title,
          value: Number(record.value),
          type: record.type,
          category_id: category?.id,
        };
      });

      const transactions = this.transactionsRepository.create(recordsSanitize);

      await this.transactionsRepository.save(transactions);

      return transactions;
    } catch (e) {
      throw new AppError('File not found.');
    }
  }
}

export default ImportTransactionsService;
