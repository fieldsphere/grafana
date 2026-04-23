import { deprecationWarning } from './deprecationWarning';
import * as structLogMod from './structLog';

test('It should not output deprecation warnings too often', () => {
  let dateNowValue = 10000000;

  const structLogSpy = jest.spyOn(structLogMod, 'structLog').mockImplementation();
  const spyDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => dateNowValue);
  // Make sure the mock works
  expect(Date.now()).toEqual(dateNowValue);
  expect(structLogSpy).toHaveBeenCalledTimes(0);

  // Call the deprecation many times
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  expect(structLogSpy).toHaveBeenCalledTimes(1);

  // Increment the time by 1min
  dateNowValue += 60000;
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  expect(structLogSpy).toHaveBeenCalledTimes(2);

  deprecationWarning('file2', 'oldName', 'newName');
  deprecationWarning('file2', 'oldName', 'newName');
  deprecationWarning('file2', 'oldName', 'newName');
  expect(structLogSpy).toHaveBeenCalledTimes(3);

  // or restoreMocks automatically?
  structLogSpy.mockRestore();
  spyDateNow.mockRestore();
});
