import { createJobQueue } from '..';

test('createJobQueue works correctly', () => {
  const createMockSelectorTrigger = (toAddFlag: boolean) => ({
    trigger: jest.fn(),
    isToAdd: () => toAddFlag,
  });

  const { addToQueue, processQueue, resetQueue } = createJobQueue();

  const selectorTrigger1 = createMockSelectorTrigger(true);
  const selectorTrigger2 = createMockSelectorTrigger(false);
  const selectorTrigger3 = createMockSelectorTrigger(true);

  addToQueue(selectorTrigger1);
  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(1);

  selectorTrigger1.trigger.mock.calls = [];

  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(0);

  selectorTrigger1.trigger.mock.calls = [];

  addToQueue(selectorTrigger1);
  addToQueue(selectorTrigger2);
  addToQueue(selectorTrigger3);
  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(1);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(1);

  selectorTrigger1.trigger.mock.calls = [];
  selectorTrigger2.trigger.mock.calls = [];
  selectorTrigger3.trigger.mock.calls = [];

  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(0);

  const errorTrigger = {
    trigger: () => {
      throw Error();
    },

    isToAdd: () => true,
  };

  selectorTrigger1.trigger.mock.calls = [];
  selectorTrigger2.trigger.mock.calls = [];
  selectorTrigger3.trigger.mock.calls = [];

  addToQueue(selectorTrigger1);
  addToQueue(errorTrigger);
  addToQueue(selectorTrigger2);
  addToQueue(selectorTrigger3);
  expect(processQueue).toThrow();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(1);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(0);

  selectorTrigger1.trigger.mock.calls = [];
  selectorTrigger2.trigger.mock.calls = [];
  selectorTrigger3.trigger.mock.calls = [];

  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(0);

  selectorTrigger1.trigger.mock.calls = [];
  selectorTrigger2.trigger.mock.calls = [];
  selectorTrigger3.trigger.mock.calls = [];

  addToQueue(selectorTrigger1);
  addToQueue(errorTrigger);
  addToQueue(selectorTrigger2);
  addToQueue(selectorTrigger3);
  expect(processQueue).toThrow();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(1);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(0);

  selectorTrigger1.trigger.mock.calls = [];
  selectorTrigger2.trigger.mock.calls = [];
  selectorTrigger3.trigger.mock.calls = [];

  resetQueue();
  processQueue();
  expect(selectorTrigger1.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger2.trigger).toHaveBeenCalledTimes(0);
  expect(selectorTrigger3.trigger).toHaveBeenCalledTimes(0);
});
